import {
  Resolver,
  ResolveField,
  Parent,
  Query,
  Args,
  Mutation,
} from '@nestjs/graphql';
import { ToConnection } from 'src/application/graphql/lists/connection/to-connection.decorator';
import { ToListConfig } from 'src/application/graphql/lists/list-args/to-list-config.decorator';
import { CompanyService } from 'src/domain/company/company.service';
import { CreateCompanyInput } from 'src/domain/company/inputs/create-company.input';
import { CreateCompanyOutput } from 'src/domain/company/outputs/create-company.output';
import { CompanyListArgs } from './args/company-list.args';
import { Company } from './company.entity';
import { CompanyConnection } from './outputs/company-connection.output';

@Resolver(() => Company)
export class CompanyResolver {
  constructor(private companyService: CompanyService) {}

  @Query(() => CompanyConnection)
  async companies(
    @Args() args: CompanyListArgs,
    @ToListConfig() toListConfig: ToListConfig,
    @ToConnection() toConnection: ToConnection<Company>
  ): Promise<CompanyConnection> {
    const listConfig = toListConfig(args);
    const page = await this.companyService.getPage(listConfig);
    const connection = toConnection(page);
    return connection;
  }

  @ResolveField()
  name(@Parent() company: Company) {
    return company.name;
  }

  @ResolveField()
  timezone(@Parent() company: Company) {
    return company.timezone;
  }

  @Mutation(() => CreateCompanyOutput, { name: 'createCompany' })
  async create(
    @Args('input') input: CreateCompanyInput
  ): Promise<CreateCompanyOutput> {
    const { name, parentOrganizationId } = input;
    const company = await this.companyService.create(
      name,
      parentOrganizationId
    );
    return { company };
  }
}
